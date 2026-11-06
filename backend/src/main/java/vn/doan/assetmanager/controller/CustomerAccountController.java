package vn.doan.assetmanager.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.doan.assetmanager.dto.request.CustomerAccountAdminRequest;
import vn.doan.assetmanager.dto.request.CustomerLoginRequest;
import vn.doan.assetmanager.dto.request.CustomerProfileRequest;
import vn.doan.assetmanager.dto.request.CustomerRegistrationRequest;
import vn.doan.assetmanager.dto.response.CustomerAccountResponse;
import vn.doan.assetmanager.dto.response.CustomerAuthResponse;
import vn.doan.assetmanager.service.CustomerAccountService;

@RestController
@RequestMapping("/api/store")
public class CustomerAccountController {

    private final CustomerAccountService accountService;

    public CustomerAccountController(CustomerAccountService accountService) {
        this.accountService = accountService;
    }

    @PostMapping("/auth/register")
    @ResponseStatus(HttpStatus.CREATED)
    public CustomerAuthResponse register(@Valid @RequestBody CustomerRegistrationRequest request) {
        return accountService.register(request);
    }

    @PostMapping("/auth/login")
    public CustomerAuthResponse login(@Valid @RequestBody CustomerLoginRequest request) {
        return accountService.login(request);
    }

    @GetMapping("/account")
    @PreAuthorize("hasRole('CUSTOMER')")
    public CustomerAccountResponse profile(Authentication authentication) {
        return accountService.profile(authentication.getName());
    }

    @PutMapping("/account")
    @PreAuthorize("hasRole('CUSTOMER')")
    public CustomerAccountResponse updateProfile(Authentication authentication,
            @Valid @RequestBody CustomerProfileRequest request) {
        return accountService.updateProfile(authentication.getName(), request);
    }

    @GetMapping("/accounts")
    @PreAuthorize("hasRole('ADMIN')")
    public List<CustomerAccountResponse> list() {
        return accountService.list();
    }

    @PutMapping("/accounts/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public CustomerAccountResponse updateByAdmin(@PathVariable long id,
            @Valid @RequestBody CustomerAccountAdminRequest request) {
        return accountService.updateByAdmin(id, request);
    }
}
