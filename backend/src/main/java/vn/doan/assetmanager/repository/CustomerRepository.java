package vn.doan.assetmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import vn.doan.assetmanager.model.Customer;
import java.util.List;
import java.util.Optional;

public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    Optional<Customer> findByPhoneAndInTrashFalse(String phone);
    Optional<Customer> findByPhoneAndIdNot(String phone, Long id);
    Optional<Customer> findByIdAndInTrashFalse(Long id);
    List<Customer> findAllByInTrashFalse();
    @Query("select customer from Customer customer where customer.inTrash = false and " +
            "(lower(customer.fullName) like lower(concat('%', :search, '%')) or customer.phone like concat('%', :search, '%'))")
    List<Customer> searchActive(@Param("search") String search);
    List<Customer> findByMembershipTierAndInTrashFalse(String tier);
    List<Customer> findByFullNameContainingIgnoreCaseOrPhoneContaining(String name, String phone);
    List<Customer> findByMembershipTier(String tier);
}
