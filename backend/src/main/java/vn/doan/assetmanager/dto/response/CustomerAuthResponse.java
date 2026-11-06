package vn.doan.assetmanager.dto.response;

public record CustomerAuthResponse(
        String token,
        String username,
        String displayName,
        String role) {
}
