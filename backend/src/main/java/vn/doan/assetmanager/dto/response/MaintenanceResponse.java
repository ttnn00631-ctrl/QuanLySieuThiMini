package vn.doan.assetmanager.dto.response;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

import java.time.Instant;

public record MaintenanceResponse(Long id, Long assetId, String assetCode, String issue, Instant openedAt,
    Instant closedAt, String resolutionNote, MaintenanceStatus status) {

    public static MaintenanceResponse from(MaintenanceRecord record) {
        return new MaintenanceResponse(record.getId(), record.getAsset().getId(), record.getAsset().getAssetCode(),
            record.getIssue(), record.getOpenedAt(),
                record.getClosedAt(), record.getResolutionNote(), record.getStatus());
    }
}
