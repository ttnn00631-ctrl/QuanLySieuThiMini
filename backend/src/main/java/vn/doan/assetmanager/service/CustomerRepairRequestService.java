package vn.doan.assetmanager.service;

import java.util.List;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import vn.doan.assetmanager.dto.request.CreateCustomerRepairRequest;
import vn.doan.assetmanager.dto.request.MaintenanceCloseRequest;
import vn.doan.assetmanager.dto.response.CustomerRepairRequestResponse;
import vn.doan.assetmanager.exception.ConflictException;
import vn.doan.assetmanager.exception.NotFoundException;
import vn.doan.assetmanager.model.CustomerRepairRequest;
import vn.doan.assetmanager.model.MaintenanceStatus;
import vn.doan.assetmanager.repository.CustomerAccountRepository;
import vn.doan.assetmanager.repository.CustomerRepairRequestRepository;

@Service
public class CustomerRepairRequestService {

    private final CustomerAccountRepository accounts;
    private final CustomerRepairRequestRepository requests;

    public CustomerRepairRequestService(CustomerAccountRepository accounts,
            CustomerRepairRequestRepository requests) {
        this.accounts = accounts;
        this.requests = requests;
    }

    @Transactional
    public CustomerRepairRequestResponse submit(String username, CreateCustomerRepairRequest request) {
        var account = accounts.findByUsername(username)
                .filter(candidate -> candidate.isEnabled())
                .orElseThrow(() -> new NotFoundException("Không tìm thấy tài khoản khách hàng đang hoạt động"));
        if (account.getPhone() == null || account.getPhone().isBlank()) {
            throw new ConflictException("Vui lòng bổ sung số điện thoại trong trang tài khoản trước khi gửi phản hồi sản phẩm");
        }
        var saved = requests.save(new CustomerRepairRequest(account, request.deviceType().trim(),
                request.manufacturer().trim(), request.modelName().trim(),
                normalize(request.serialNumber()), request.issue().trim()));
        return CustomerRepairRequestResponse.from(saved);
    }

    @Transactional(readOnly = true)
    public List<CustomerRepairRequestResponse> openRequests() {
        return requests.findAllByStatusOrderByOpenedAtDesc(MaintenanceStatus.OPEN).stream()
                .map(CustomerRepairRequestResponse::from)
                .toList();
    }

    @Transactional
    public CustomerRepairRequestResponse close(long id, MaintenanceCloseRequest closeRequest) {
        var request = requests.findById(id)
                .orElseThrow(() -> new NotFoundException("Không tìm thấy phản hồi sản phẩm"));
        if (request.getStatus() == MaintenanceStatus.CLOSED) {
            throw new ConflictException("Phản hồi sản phẩm đã được hoàn tất");
        }
        request.close(normalize(closeRequest.resolutionNote()));
        return CustomerRepairRequestResponse.from(request);
    }

    private String normalize(String value) {
        return value == null || value.isBlank() ? null : value.trim();
    }
}
