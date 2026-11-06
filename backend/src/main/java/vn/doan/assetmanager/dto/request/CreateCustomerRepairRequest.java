package vn.doan.assetmanager.dto.request;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record CreateCustomerRepairRequest(
        @NotBlank @Size(max = 40) String deviceType,
        @NotBlank @Size(max = 100) String manufacturer,
        @NotBlank @Size(max = 120) String modelName,
        @Size(max = 100) String serialNumber,
        @NotBlank @Size(max = 1000) String issue) {
}
