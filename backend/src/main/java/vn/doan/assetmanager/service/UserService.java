package vn.doan.assetmanager.service;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.security.JwtService;

import java.util.List;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
public class UserService {

    private final AppUserRepository users;
    private final PasswordEncoder passwordEncoder;

    public UserService(AppUserRepository users, PasswordEncoder passwordEncoder) {
        this.users = users;
        this.passwordEncoder = passwordEncoder;
    }

    @Transactional(readOnly = true)
    public List<UserResponse> list() {
        return users.findAllByInTrashFalseOrderByDisplayNameAsc().stream().map(UserResponse::from).toList();
    }

    @Transactional
    public UserResponse create(CreateUserRequest request) {
        if (users.existsByUsername(request.username().trim())) {
            throw new ConflictException("Tên đăng nhập đã tồn tại");
        }
        AppUser user = new AppUser(request.username().trim(), request.displayName().trim(),
                passwordEncoder.encode(request.password()), request.role());
        return UserResponse.from(users.save(user));
    }

    @Transactional
    public UserResponse update(long id, UpdateUserRequest request, String actingUsername) {
        AppUser user = users.findByIdAndInTrashFalse(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản"));
        boolean changingLastAdmin = user.getRole() == UserRole.ADMIN && user.isEnabled()
                && (request.role() != UserRole.ADMIN || !request.enabled());
        if (changingLastAdmin && users.countByRoleAndEnabledTrue(UserRole.ADMIN) <= 1) {
            throw new ConflictException("Không thể vô hiệu hóa hoặc hạ quyền quản trị viên cuối cùng");
        }
        if (user.getUsername().equals(actingUsername)
                && (request.role() != UserRole.ADMIN || !request.enabled())) {
            throw new AccessDeniedException("Không thể tự hạ quyền hoặc vô hiệu hóa tài khoản đang đăng nhập");
        }

        String passwordHash = request.password() == null || request.password().isBlank()
                ? null : passwordEncoder.encode(request.password());
        user.updateAccount(request.displayName().trim(), request.role(), request.enabled(), passwordHash);
        return UserResponse.from(users.save(user));
    }
}
