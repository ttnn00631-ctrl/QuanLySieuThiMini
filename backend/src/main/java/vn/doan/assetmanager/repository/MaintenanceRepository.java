package vn.doan.assetmanager.repository;

import vn.doan.assetmanager.model.*;

import java.util.List;
import org.springframework.data.jpa.repository.JpaRepository;

public interface MaintenanceRepository extends JpaRepository<MaintenanceRecord, Long> {
    List<MaintenanceRecord> findByAsset_IdOrderByOpenedAtDesc(Long assetId);
    List<MaintenanceRecord> findAllByStatusAndAsset_InTrashFalseOrderByOpenedAtDesc(MaintenanceStatus status);
    void deleteByAsset_Id(Long assetId);
}
