package vn.doan.assetmanager.dto.response;

import java.time.LocalDateTime;
import vn.doan.assetmanager.model.TrashRecord;

public record TrashRecordResponse(
        Long id,
        String type,
        Long entityId,
        String label,
        String summary,
        LocalDateTime deletedAt,
        String deletedBy) {

    public static TrashRecordResponse from(TrashRecord record) {
        return new TrashRecordResponse(record.getId(), record.getItemType(), record.getEntityId(),
                record.getLabel(), record.getSummary(), record.getDeletedAt(), record.getDeletedBy());
    }
}
