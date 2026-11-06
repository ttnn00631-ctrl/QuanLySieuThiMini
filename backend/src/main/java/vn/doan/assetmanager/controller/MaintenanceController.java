package vn.doan.assetmanager.controller;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.service.*;
import vn.doan.assetmanager.dto.response.CustomerRepairRequestResponse;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping
public class MaintenanceController {

    private final MaintenanceService maintenanceService;
    private final CustomerRepairRequestService customerRepairRequests;

    public MaintenanceController(MaintenanceService maintenanceService,
            CustomerRepairRequestService customerRepairRequests) {
        this.maintenanceService = maintenanceService;
        this.customerRepairRequests = customerRepairRequests;
    }

    /** ADMIN + FIXER + CASHIER: xem danh sách yêu cầu xử lý hàng lỗi đang mở */
    @GetMapping("/api/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER', 'CASHIER')")
    public List<MaintenanceResponse> openItems() {
        return maintenanceService.openItems();
    }

    @GetMapping("/api/maintenance/customer-requests")
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER')")
    public List<CustomerRepairRequestResponse> openCustomerRequests() {
        return customerRepairRequests.openRequests();
    }

    @PatchMapping("/api/maintenance/customer-requests/{requestId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER')")
    public CustomerRepairRequestResponse closeCustomerRequest(@PathVariable long requestId,
            @Valid @RequestBody MaintenanceCloseRequest request) {
        return customerRepairRequests.close(requestId, request);
    }

    /** ADMIN + FIXER + CASHIER: xem lịch sử xử lý hàng lỗi của 1 sản phẩm */
    @GetMapping("/api/assets/{assetId}/maintenance")
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER', 'CASHIER')")
    public List<MaintenanceResponse> history(@PathVariable Long assetId) {
        return maintenanceService.history(assetId);
    }

    /** ADMIN + FIXER + CASHIER: gửi yêu cầu xử lý hàng lỗi mới */
    @PostMapping("/api/assets/{assetId}/maintenance")
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER', 'CASHIER')")
    public MaintenanceResponse open(@PathVariable Long assetId, @Valid @RequestBody MaintenanceRequest request) {
        return maintenanceService.open(assetId, request);
    }

    /** Chỉ ADMIN + FIXER mới được đóng/hoàn tất yêu cầu xử lý hàng lỗi */
    @PatchMapping("/api/maintenance/{maintenanceId}/close")
    @PreAuthorize("hasAnyRole('ADMIN', 'FIXER')")
    public MaintenanceResponse close(@PathVariable Long maintenanceId,
            @Valid @RequestBody MaintenanceCloseRequest request) {
        return maintenanceService.close(maintenanceId, request);
    }
}
