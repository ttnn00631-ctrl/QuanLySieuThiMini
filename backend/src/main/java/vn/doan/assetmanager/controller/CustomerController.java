package vn.doan.assetmanager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.model.Customer;
import vn.doan.assetmanager.model.CustomerAccount;
import vn.doan.assetmanager.repository.CustomerAccountRepository;
import vn.doan.assetmanager.repository.CustomerRepository;
import vn.doan.assetmanager.service.TrashService;
import org.springframework.security.core.Authentication;

import java.util.List;

@RestController
@RequestMapping("/api/customers")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CASHIER')")
public class CustomerController {

    private final CustomerRepository customerRepository;
    private final CustomerAccountRepository customerAccounts;
    private final TrashService trashService;

    public CustomerController(CustomerRepository customerRepository, CustomerAccountRepository customerAccounts,
            TrashService trashService) {
        this.customerRepository = customerRepository;
        this.customerAccounts = customerAccounts;
        this.trashService = trashService;
    }

    @GetMapping
    public List<Customer> getAll(@RequestParam(required = false) String search,
                                 @RequestParam(required = false) String tier) {
        if (search != null && !search.trim().isEmpty()) {
            return customerRepository.searchActive(search.trim());
        }
        if (tier != null && !tier.trim().isEmpty() && !tier.equalsIgnoreCase("ALL")) {
            return customerRepository.findByMembershipTierAndInTrashFalse(tier.toUpperCase());
        }
        return customerRepository.findAllByInTrashFalse();
    }

    @GetMapping("/{id}")
    public ResponseEntity<Customer> getById(@PathVariable Long id) {
        return customerRepository.findByIdAndInTrashFalse(id)
                .map(ResponseEntity::ok)
                .orElse(ResponseEntity.notFound().build());
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Customer> create(@RequestBody Customer customer) {
        if (customer.getPhone() != null && customerRepository.findByPhone(customer.getPhone()).isPresent()) {
            throw new ConflictException("Số điện thoại đã được sử dụng bởi khách hàng khác");
        }
        Customer saved = customerRepository.save(customer);
        customerAccounts.findByPhone(saved.getPhone()).ifPresent(account -> {
            ensureAccountCanLink(account, saved.getId());
            account.linkCustomer(saved);
            account.updateProfile(saved.getFullName(), saved.getEmail(), saved.getPhone());
        });
        return ResponseEntity.ok(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Transactional
    public ResponseEntity<Customer> update(@PathVariable Long id, @RequestBody Customer customer) {
        return customerRepository.findByIdAndInTrashFalse(id).map(existing -> {
            if (customer.getPhone() != null
                    && customerRepository.findByPhoneAndIdNot(customer.getPhone(), id).isPresent()) {
                throw new ConflictException("Số điện thoại đã được sử dụng bởi khách hàng khác");
            }
            CustomerAccount linkedAccount = customerAccounts.findByCustomer_Id(id).orElse(null);
            CustomerAccount accountUsingPhone = customer.getPhone() == null
                    ? null : customerAccounts.findByPhone(customer.getPhone()).orElse(null);
            if (linkedAccount != null && accountUsingPhone != null
                    && !linkedAccount.getId().equals(accountUsingPhone.getId())) {
                throw new ConflictException("Số điện thoại đã được sử dụng bởi tài khoản khách hàng khác");
            }
            CustomerAccount account = linkedAccount != null ? linkedAccount : accountUsingPhone;
            if (account != null) {
                ensureAccountCanLink(account, id);
                if (customer.getPhone() != null) {
                    customerAccounts.findByPhone(customer.getPhone())
                            .filter(other -> !other.getId().equals(account.getId()))
                            .ifPresent(other -> {
                                throw new ConflictException("Số điện thoại đã được sử dụng bởi tài khoản khách hàng khác");
                            });
                }
            }
            existing.setFullName(customer.getFullName());
            existing.setPhone(customer.getPhone());
            existing.setEmail(customer.getEmail());
            existing.setAddress(customer.getAddress());
            existing.setMembershipTier(customer.getMembershipTier());
            if (customer.getTotalSpent() != null) existing.setTotalSpent(customer.getTotalSpent());
            if (customer.getOrdersCount() != null) existing.setOrdersCount(customer.getOrdersCount());
            Customer saved = customerRepository.save(existing);
            if (account != null) {
                account.linkCustomer(saved);
                account.updateProfile(saved.getFullName(), saved.getEmail(), saved.getPhone());
            }
            return ResponseEntity.ok(saved);
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, Authentication authentication) {
        trashService.moveToTrash("CUSTOMER", id, authentication.getName());
        return ResponseEntity.noContent().build();
    }

    private void ensureAccountCanLink(CustomerAccount account, Long customerId) {
        if (account.getCustomerId() != null && !account.getCustomerId().equals(customerId)) {
            throw new ConflictException("Tài khoản khách đã liên kết với hồ sơ khách hàng khác");
        }
    }
}
