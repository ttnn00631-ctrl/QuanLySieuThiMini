package vn.doan.assetmanager.dto.response;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

public record UserResponse(Long id, String username, String displayName, UserRole role, boolean enabled) {

    public static UserResponse from(AppUser user) {
        return new UserResponse(user.getId(), user.getUsername(), user.getDisplayName(), user.getRole(), user.isEnabled());
    }
}
