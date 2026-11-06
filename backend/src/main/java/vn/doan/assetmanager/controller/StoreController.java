package vn.doan.assetmanager.controller;

import java.math.BigDecimal;
import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import jakarta.validation.Valid;
import java.time.LocalDate;
import java.util.ArrayList;
import java.util.HashSet;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import vn.doan.assetmanager.dto.request.CreateStoreOrderRequest;
import vn.doan.assetmanager.dto.response.StoreProductResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.AssetStatus;
import vn.doan.assetmanager.model.Customer;
import vn.doan.assetmanager.model.SaleOrder;
import vn.doan.assetmanager.repository.AssetRepository;
import vn.doan.assetmanager.repository.CustomerRepository;
import vn.doan.assetmanager.repository.CustomerAccountRepository;
import vn.doan.assetmanager.repository.SaleOrderRepository;

@RestController
@RequestMapping("/api/store")
public class StoreController {

    private final AssetRepository assets;
    private final SaleOrderRepository orders;
    private final CustomerRepository customers;
    private final CustomerAccountRepository customerAccounts;
    private final ObjectMapper objectMapper;

    public StoreController(AssetRepository assets, SaleOrderRepository orders,
            CustomerRepository customers, CustomerAccountRepository customerAccounts, ObjectMapper objectMapper) {
        this.assets = assets;
        this.orders = orders;
        this.customers = customers;
        this.customerAccounts = customerAccounts;
        this.objectMapper = objectMapper;
    }

    @GetMapping("/products")
    public List<StoreProductResponse> products() {
        return assets.findByStatusAndInTrashFalse(AssetStatus.AVAILABLE).stream()
                .filter(asset -> asset.getPurchaseCost() != null && asset.getPurchaseCost().signum() > 0)
                .map(StoreProductResponse::from)
                .toList();
    }

    @PostMapping("/products/{assetId}/view")
    @Transactional
    public int recordProductView(@PathVariable Long assetId) {
        if (assets.incrementStoreViewCount(assetId, AssetStatus.AVAILABLE) == 0) {
            throw new NotFoundException("Sản phẩm không còn sẵn sàng");
        }
        return assets.findById(assetId)
                .orElseThrow(() -> new NotFoundException("Sản phẩm không còn sẵn sàng"))
                .getStoreViewCount();
    }

    @PostMapping("/requests")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    @Transactional
    public ResponseEntity<SaleOrder> createRequest(@Valid @RequestBody CreateStoreOrderRequest request)
            throws JsonProcessingException {
        String username = SecurityContextHolder.getContext().getAuthentication().getName();
        var account = customerAccounts.findByUsername(username)
                .filter(candidate -> candidate.isEnabled())
                .orElseThrow(() -> new ConflictException("Vui lòng đăng nhập tài khoản khách hàng"));
        if (account.getPhone() == null || account.getPhone().isBlank()) {
            throw new ConflictException("Vui lòng bổ sung số điện thoại trong trang tài khoản trước khi đặt hàng");
        }
        String customerName = account.getDisplayName().trim();
        String customerPhone = account.getPhone().trim();
        if (new HashSet<>(request.assetIds()).size() != request.assetIds().size()) {
            throw new ConflictException("Không thể gửi cùng một sản phẩm nhiều lần");
        }
        List<Map<String, Object>> orderItems = new ArrayList<>();
        BigDecimal subtotal = BigDecimal.ZERO;
        for (Long assetId : request.assetIds()) {
            var asset = assets.findByIdForUpdate(assetId)
                    .orElseThrow(() -> new ConflictException("Một sản phẩm đã không còn sẵn sàng"));
            if (asset.getStatus() != AssetStatus.AVAILABLE || asset.getPurchaseCost() == null
                    || asset.getPurchaseCost().signum() <= 0) {
                throw new ConflictException("Một sản phẩm đã không còn sẵn sàng");
            }
            BigDecimal price = asset.getPurchaseCost();
            subtotal = subtotal.add(price);
            orderItems.add(Map.of(
                    "assetId", asset.getId(),
                    "modelName", asset.getModelName(),
                    "assetCode", asset.getAssetCode(),
                    "quantity", 1,
                    "unitPrice", price,
                    "total", price));
        }
        SaleOrder order = new SaleOrder(
                "WEB-" + UUID.randomUUID().toString().substring(0, 8).toUpperCase(),
                customerName,
                customerPhone,
                false,
                "Khách gửi từ website",
                subtotal,
                BigDecimal.ZERO,
                subtotal,
                "PENDING",
                objectMapper.writeValueAsString(orderItems));
        order.setOrderStatus("PENDING");
        Customer customer = account.getCustomerId() == null
                ? null
                : customers.findById(account.getCustomerId())
                        .orElseThrow(() -> new ConflictException("Không tìm thấy hồ sơ khách hàng đã liên kết"));
        if (customer != null && customer.isInTrash()) {
            throw new ConflictException("Hồ sơ khách hàng đang ở trong thùng rác; Admin cần khôi phục hồ sơ trước");
        }
        if (customer == null) {
            customer = customers.findByPhone(customerPhone).orElse(null);
            if (customer != null && customer.isInTrash()) {
                throw new ConflictException("Số điện thoại đang thuộc hồ sơ khách hàng trong thùng rác; Admin cần khôi phục hồ sơ trước");
            }
            if (customer != null) {
                var linkedAccount = customerAccounts.findByCustomer_Id(customer.getId()).orElse(null);
                if (linkedAccount != null && !linkedAccount.getId().equals(account.getId())) {
                    throw new ConflictException("Hồ sơ khách hàng đã liên kết với tài khoản khác");
                }
                customer.setFullName(customerName);
                customer.setEmail(account.getEmail());
            } else {
                customer = customers.save(new Customer(
                        customerName,
                        customerPhone,
                        account.getEmail(),
                        null,
                        "BRONZE",
                        BigDecimal.ZERO,
                        0,
                        LocalDate.now()));
            }
            account.linkCustomer(customer);
        }
        order.setCustomer(customer);
        return ResponseEntity.status(HttpStatus.CREATED).body(orders.save(order));
    }
}
