package vn.doan.assetmanager.dto.request;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Pattern;
import jakarta.validation.constraints.Size;

public record CustomerAccountAdminRequest(
        @NotBlank @Size(max = 120) String displayName,
        @Email @Size(max = 120) String email,
        @Pattern(regexp = "^$|[0-9+() -]{7,20}") String phone,
        boolean enabled,
        @Size(min = 8, max = 72) String password) {
}
