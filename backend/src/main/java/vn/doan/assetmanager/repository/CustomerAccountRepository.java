package vn.doan.assetmanager.repository;

import java.util.List;
import java.util.Optional;
import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.CustomerAccount;

public interface CustomerAccountRepository extends JpaRepository<CustomerAccount, Long> {
    Optional<CustomerAccount> findByUsername(String username);
    Optional<CustomerAccount> findByPhone(String phone);
    Optional<CustomerAccount> findByCustomer_Id(Long customerId);
    Optional<CustomerAccount> findByIdAndEnabledTrue(Long id);
    List<CustomerAccount> findAllByOrderByCreatedAtDesc();
    boolean existsByUsername(String username);
    boolean existsByPhoneAndIdNot(String phone, Long id);
}
