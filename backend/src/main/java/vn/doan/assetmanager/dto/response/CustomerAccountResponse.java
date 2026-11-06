package vn.doan.assetmanager.dto.response;

import java.time.LocalDateTime;
import vn.doan.assetmanager.model.CustomerAccount;

public record CustomerAccountResponse(
        Long id,
        String username,
        String displayName,
        String email,
        String phone,
        boolean enabled,
        LocalDateTime createdAt) {

    public static CustomerAccountResponse from(CustomerAccount account) {
        return new CustomerAccountResponse(account.getId(), account.getUsername(), account.getDisplayName(),
                account.getEmail(), account.getPhone(), account.isEnabled(), account.getCreatedAt());
    }
}
