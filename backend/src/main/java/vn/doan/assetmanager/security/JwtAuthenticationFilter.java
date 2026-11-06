package vn.doan.assetmanager.security;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.repository.AppUserRepository;
import vn.doan.assetmanager.repository.CustomerAccountRepository;
import vn.doan.assetmanager.service.*;

import io.jsonwebtoken.Claims;
import io.jsonwebtoken.JwtException;
import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import java.io.IOException;
import java.util.List;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;

@Component
public class JwtAuthenticationFilter extends OncePerRequestFilter {

    private final JwtService jwtService;
    private final AppUserRepository users;
    private final CustomerAccountRepository customerAccounts;

    public JwtAuthenticationFilter(JwtService jwtService, AppUserRepository users,
            CustomerAccountRepository customerAccounts) {
        this.jwtService = jwtService;
        this.users = users;
        this.customerAccounts = customerAccounts;
    }

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, FilterChain chain)
            throws ServletException, IOException {
        String authorization = request.getHeader("Authorization");
        if (authorization != null && authorization.startsWith("Bearer ")) {
            try {
                Claims claims = jwtService.parse(authorization.substring(7));
                String username = claims.getSubject();
                if (username != null) {
                    if ("CUSTOMER".equals(claims.get("accountType", String.class))) {
                        var account = customerAccounts.findByUsername(username)
                                .filter(candidate -> candidate.isEnabled())
                                .orElse(null);
                        if (account != null) {
                            var authentication = new UsernamePasswordAuthenticationToken(username, null,
                                    List.of(new SimpleGrantedAuthority("ROLE_CUSTOMER")));
                            SecurityContextHolder.getContext().setAuthentication(authentication);
                        } else {
                            SecurityContextHolder.clearContext();
                        }
                        chain.doFilter(request, response);
                        return;
                    }
                    var user = users.findByUsername(username)
                            .filter(AppUser::isEnabled)
                            .filter(candidate -> !candidate.isInTrash())
                            .orElse(null);
                    if (user != null) {
                        var authentication = new UsernamePasswordAuthenticationToken(username, null,
                                List.of(new SimpleGrantedAuthority("ROLE_" + user.getRole().name())));
                        SecurityContextHolder.getContext().setAuthentication(authentication);
                    }
                } else {
                    SecurityContextHolder.clearContext();
                }
            } catch (JwtException | IllegalArgumentException exception) {
                SecurityContextHolder.clearContext();
            }
        }
        chain.doFilter(request, response);
    }
}
