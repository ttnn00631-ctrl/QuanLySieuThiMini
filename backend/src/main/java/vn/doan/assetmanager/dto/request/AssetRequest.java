package vn.doan.assetmanager.dto.request;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.PositiveOrZero;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.time.LocalDate;

public record AssetRequest(
        @NotBlank @Size(max = 40) String assetCode,
        @Size(max = 100) String serialNumber,
        @NotNull AssetType type,
        @NotBlank @Size(max = 100) String manufacturer,
        @NotBlank @Size(max = 120) String modelName,
        @Size(max = 300) String processor,
        @PositiveOrZero Integer memoryGb,
        @Size(max = 120) String storage,
        @jakarta.validation.constraints.DecimalMin("0.0") java.math.BigDecimal screenSizeInch,
        @PositiveOrZero Integer refreshRateHz,
        @Size(max = 300) String usbPorts,
        Boolean hasHeadphoneJack,
        Boolean hasDedicatedGraphics,
        LocalDate purchaseDate,
        LocalDate warrantyUntil,
        @DecimalMin("0.0") BigDecimal purchaseCost,
        @NotBlank @Size(max = 120) String location,
        @Size(max = 1000) String notes) {
}
