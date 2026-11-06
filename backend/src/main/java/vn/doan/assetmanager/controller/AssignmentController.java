package vn.doan.assetmanager.controller;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.repository.*;
import vn.doan.assetmanager.exception.*;
import vn.doan.assetmanager.service.*;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/assets/{assetId}/assignments")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CASHIER')")
public class AssignmentController {

    private final AssignmentService assignmentService;

    public AssignmentController(AssignmentService assignmentService) {
        this.assignmentService = assignmentService;
    }

    @GetMapping
    public List<AssignmentResponse> history(@PathVariable Long assetId) {
        return assignmentService.history(assetId);
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public AssetResponse assign(@PathVariable Long assetId, @Valid @RequestBody AssignmentRequest request) {
        return assignmentService.assign(assetId, request);
    }

    @PostMapping("/return")
    @PreAuthorize("hasAnyRole('ADMIN', 'STAFF')")
    public AssetResponse returnAsset(@PathVariable Long assetId, @Valid @RequestBody ReturnRequest request) {
        return assignmentService.returnAsset(assetId, request.note());
    }
}
