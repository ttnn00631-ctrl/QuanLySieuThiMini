package vn.doan.assetmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;

public record MoveToTrashRequest(
        @NotBlank @Size(max = 20) String type,
        @NotNull Long id) {
}
