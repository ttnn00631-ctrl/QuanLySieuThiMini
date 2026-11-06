package vn.doan.assetmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import vn.doan.assetmanager.model.UserRole;

public record UpdateUserRequest(
        @NotBlank @Size(max = 120) String displayName,
        @NotNull UserRole role,
        @NotNull Boolean enabled,
        @Size(max = 72) String password) {
}
