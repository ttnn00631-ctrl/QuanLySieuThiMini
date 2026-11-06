package vn.doan.assetmanager.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.CustomerRepairRequest;
import vn.doan.assetmanager.model.MaintenanceStatus;

public interface CustomerRepairRequestRepository extends JpaRepository<CustomerRepairRequest, Long> {
    List<CustomerRepairRequest> findAllByStatusOrderByOpenedAtDesc(MaintenanceStatus status);
    Optional<CustomerRepairRequest> findByIdAndCustomerAccount_Username(long id, String username);
}
