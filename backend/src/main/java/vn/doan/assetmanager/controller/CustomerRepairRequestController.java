package vn.doan.assetmanager.controller;

import jakarta.validation.Valid;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.doan.assetmanager.dto.request.CreateCustomerRepairRequest;
import vn.doan.assetmanager.dto.response.CustomerRepairRequestResponse;
import vn.doan.assetmanager.service.CustomerRepairRequestService;

@RestController
@RequestMapping("/api/store/repair-requests")
public class CustomerRepairRequestController {

    private final CustomerRepairRequestService repairRequests;

    public CustomerRepairRequestController(CustomerRepairRequestService repairRequests) {
        this.repairRequests = repairRequests;
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasRole('CUSTOMER')")
    public CustomerRepairRequestResponse submit(Authentication authentication,
            @Valid @RequestBody CreateCustomerRepairRequest request) {
        return repairRequests.submit(authentication.getName(), request);
    }
}
