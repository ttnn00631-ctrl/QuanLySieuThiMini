package vn.doan.assetmanager.repository;

import vn.doan.assetmanager.model.*;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AssignmentRepository extends JpaRepository<AssignmentRecord, Long> {
    List<AssignmentRecord> findByAsset_IdOrderByAssignedAtDesc(Long assetId);
    Optional<AssignmentRecord> findFirstByAsset_IdAndReturnedAtIsNullOrderByAssignedAtDesc(Long assetId);
    void deleteByAsset_Id(Long assetId);
}
