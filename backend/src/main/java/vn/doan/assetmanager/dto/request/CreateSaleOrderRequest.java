package vn.doan.assetmanager.dto.request;

import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotEmpty;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import java.math.BigDecimal;
import java.util.List;

public record CreateSaleOrderRequest(
        Long customerId,
        boolean guest,
        @Size(max = 120)
        String guestName,
        @Size(max = 30)
        String guestPhone,
        @NotBlank String paymentMethod,
        @DecimalMin("0.0") BigDecimal cashReceived,
        @NotEmpty List<@Valid Item> items) {

    public record Item(
            @NotNull Long assetId,
            @Min(1) @Max(1) int quantity) {
    }
}
