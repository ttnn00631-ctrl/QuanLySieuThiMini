package vn.doan.assetmanager.dto.response;

import java.time.Instant;
import vn.doan.assetmanager.model.CustomerRepairRequest;
import vn.doan.assetmanager.model.MaintenanceStatus;

public record CustomerRepairRequestResponse(
        Long id,
        String customerName,
        String customerUsername,
        String customerPhone,
        String customerEmail,
        String deviceType,
        String manufacturer,
        String modelName,
        String serialNumber,
        String issue,
        Instant openedAt,
        Instant closedAt,
        String resolutionNote,
        MaintenanceStatus status) {

    public static CustomerRepairRequestResponse from(CustomerRepairRequest request) {
        var account = request.getCustomerAccount();
        return new CustomerRepairRequestResponse(request.getId(), account.getDisplayName(), account.getUsername(),
                account.getPhone(), account.getEmail(), request.getDeviceType(), request.getManufacturer(),
                request.getModelName(), request.getSerialNumber(), request.getIssue(), request.getOpenedAt(),
                request.getClosedAt(), request.getResolutionNote(), request.getStatus());
    }
}
