package vn.doan.assetmanager.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.TrashRecord;

public interface TrashRecordRepository extends JpaRepository<TrashRecord, Long> {
    List<TrashRecord> findAllByOrderByDeletedAtDesc();
    Optional<TrashRecord> findFirstByItemTypeAndEntityId(String itemType, Long entityId);
}
