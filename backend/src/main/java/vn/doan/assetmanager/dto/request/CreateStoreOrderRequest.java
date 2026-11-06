package vn.doan.assetmanager.dto.request;

import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.util.List;

public record CreateStoreOrderRequest(
        @NotEmpty @Size(max = 20) List<@NotNull Long> assetIds) {
}
