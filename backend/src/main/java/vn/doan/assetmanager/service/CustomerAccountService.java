package vn.doan.assetmanager.service;

import java.util.List;
import java.math.BigDecimal;
import java.time.LocalDate;
import java.util.Locale;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.doan.assetmanager.dto.request.CustomerAccountAdminRequest;
import vn.doan.assetmanager.dto.request.CustomerLoginRequest;
import vn.doan.assetmanager.dto.request.CustomerProfileRequest;
import vn.doan.assetmanager.dto.request.CustomerRegistrationRequest;
import vn.doan.assetmanager.dto.response.CustomerAccountResponse;
import vn.doan.assetmanager.dto.response.CustomerAuthResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.AppUser;
import vn.doan.assetmanager.model.CustomerAccount;
import vn.doan.assetmanager.model.Customer;
import vn.doan.assetmanager.repository.AppUserRepository;
import vn.doan.assetmanager.repository.CustomerAccountRepository;
import vn.doan.assetmanager.repository.CustomerRepository;
import vn.doan.assetmanager.security.JwtService;

@Service
public class CustomerAccountService {

    private final CustomerAccountRepository accounts;
    private final CustomerRepository customers;
    private final AppUserRepository staffUsers;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;

    public CustomerAccountService(CustomerAccountRepository accounts, CustomerRepository customers,
            AppUserRepository staffUsers,
            PasswordEncoder passwordEncoder, JwtService jwtService) {
        this.accounts = accounts;
        this.customers = customers;
        this.staffUsers = staffUsers;
        this.passwordEncoder = passwordEncoder;
        this.jwtService = jwtService;
    }

    @Transactional
    public CustomerAuthResponse register(CustomerRegistrationRequest request) {
        String username = normalizeUsername(request.username());
        if (accounts.existsByUsername(username) || staffUsers.findByUsername(username).isPresent()) {
            throw new ConflictException("Tên tài khoản đã được sử dụng");
        }
        CustomerAccount account = accounts.save(new CustomerAccount(username, request.displayName().trim(),
                passwordEncoder.encode(request.password())));
        return authResponse(account);
    }

    @Transactional(readOnly = true)
    public CustomerAuthResponse login(CustomerLoginRequest request) {
        CustomerAccount account = accounts.findByUsername(normalizeUsername(request.username()))
                .filter(CustomerAccount::isEnabled)
                .filter(candidate -> passwordEncoder.matches(request.password(), candidate.getPasswordHash()))
                .orElseThrow(() -> new BadCredentialsException("Tài khoản hoặc mật khẩu không chính xác"));
        return authResponse(account);
    }

    @Transactional(readOnly = true)
    public CustomerAccountResponse profile(String username) {
        return CustomerAccountResponse.from(findAccount(username));
    }

    @Transactional
    public CustomerAccountResponse updateProfile(String username, CustomerProfileRequest request) {
        CustomerAccount account = findAccount(username);
        String phone = normalize(request.phone());
        ensurePhoneAvailable(phone, account.getId());
        synchronizeCustomerProfile(account, request.displayName().trim(), normalize(request.email()), phone);
        account.updateProfile(request.displayName().trim(), normalize(request.email()), phone);
        return CustomerAccountResponse.from(account);
    }

    @Transactional(readOnly = true)
    public List<CustomerAccountResponse> list() {
        return accounts.findAllByOrderByCreatedAtDesc().stream()
                .map(CustomerAccountResponse::from)
                .toList();
    }

    @Transactional
    public CustomerAccountResponse updateByAdmin(long id, CustomerAccountAdminRequest request) {
        CustomerAccount account = accounts.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản khách hàng"));
        String phone = normalize(request.phone());
        ensurePhoneAvailable(phone, account.getId());
        synchronizeCustomerProfile(account, request.displayName().trim(), normalize(request.email()), phone);
        String passwordHash = request.password() == null || request.password().isBlank()
                ? null : passwordEncoder.encode(request.password());
        account.updateAdmin(request.displayName().trim(), normalize(request.email()), phone,
                request.enabled(), passwordHash);
        return CustomerAccountResponse.from(account);
    }

    private CustomerAccount findAccount(String username) {
        return accounts.findByUsername(username)
                .filter(CustomerAccount::isEnabled)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản khách hàng đang hoạt động"));
    }

    private void ensurePhoneAvailable(String phone, Long accountId) {
        if (phone != null && accounts.existsByPhoneAndIdNot(phone, accountId)) {
            throw new ConflictException("Số điện thoại đã được sử dụng bởi tài khoản khác");
        }
    }

    private void synchronizeCustomerProfile(CustomerAccount account, String displayName, String email, String phone) {
        Customer customer = account.getCustomerId() == null
                ? null
                : customers.findById(account.getCustomerId())
                        .orElseThrow(() -> new ConflictException("Không tìm thấy hồ sơ khách hàng đã liên kết"));
        if (phone == null && customer != null) {
            throw new ConflictException("Tài khoản đã có lịch sử mua hàng nên cần giữ số điện thoại liên hệ");
        }
        if (phone != null) {
            Customer matchingCustomer = customers.findByPhone(phone).orElse(null);
            if (matchingCustomer != null && (customer == null || !matchingCustomer.getId().equals(customer.getId()))) {
                if (matchingCustomer.isInTrash()) {
                    throw new ConflictException("Số điện thoại thuộc hồ sơ khách hàng trong thùng rác; Admin cần khôi phục hồ sơ trước");
                }
                if (customer != null) {
                    throw new ConflictException("Số điện thoại đã thuộc hồ sơ khách hàng khác; không thể chuyển lịch sử mua hàng sang hồ sơ đó");
                }
                ensureCustomerIsNotLinkedToAnotherAccount(matchingCustomer, account);
                customer = matchingCustomer;
                account.linkCustomer(customer);
            }
        }
        // A registered account becomes a sales customer only after a contact
        // number is provided. Existing POS profiles are reused, never duplicated.
        if (customer == null && phone != null) {
            customer = customers.save(new Customer(displayName, phone, email, null,
                    "BRONZE", BigDecimal.ZERO, 0, LocalDate.now()));
            account.linkCustomer(customer);
        }
        if (customer == null) return;
        ensurePhoneAvailableAcrossCustomers(phone, customer.getId());
        customer.setFullName(displayName);
        customer.setEmail(email);
        customer.setPhone(phone);
    }

    private void ensureCustomerIsNotLinkedToAnotherAccount(Customer customer, CustomerAccount account) {
        accounts.findByCustomer_Id(customer.getId())
                .filter(linkedAccount -> !linkedAccount.getId().equals(account.getId()))
                .ifPresent(linkedAccount -> {
                    throw new ConflictException("Hồ sơ khách hàng đã liên kết với tài khoản khác");
                });
    }

    private void ensurePhoneAvailableAcrossCustomers(String phone, Long customerId) {
        if (phone == null) return;
        Customer existing = customerId == null
                ? customers.findByPhone(phone).orElse(null)
                : customers.findByPhoneAndIdNot(phone, customerId).orElse(null);
        if (existing != null) {
            throw new ConflictException("Số điện thoại đã được sử dụng bởi hồ sơ khách hàng khác");
        }
    }

    private CustomerAuthResponse authResponse(CustomerAccount account) {
        return new CustomerAuthResponse(jwtService.createToken(account), account.getUsername(),
                account.getDisplayName(), "CUSTOMER");
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }

    private String normalizeUsername(String username) {
        return username.trim().toLowerCase(Locale.ROOT);
    }
}
