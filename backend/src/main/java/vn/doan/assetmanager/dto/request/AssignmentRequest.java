package vn.doan.assetmanager.dto.request;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record AssignmentRequest(
        @NotBlank @Size(max = 120) String assigneeName,
        @NotBlank @Size(max = 120) String location,
        @Size(max = 500) String note) {
}
