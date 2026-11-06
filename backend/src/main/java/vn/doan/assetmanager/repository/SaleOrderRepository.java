package vn.doan.assetmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.SaleOrder;
import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.Lock;
import jakarta.persistence.LockModeType;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

public interface SaleOrderRepository extends JpaRepository<SaleOrder, Long> {
    List<SaleOrder> findAllByInTrashFalseOrderByCreatedAtDesc();

    @Lock(LockModeType.PESSIMISTIC_WRITE)
    @Query("select sale from SaleOrder sale where sale.id = :id and sale.inTrash = false")
    Optional<SaleOrder> findActiveByIdForUpdate(@Param("id") Long id);
}
