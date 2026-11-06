package vn.doan.assetmanager.dto.request;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

import jakarta.validation.constraints.Size;

public record MaintenanceCloseRequest(@Size(max = 1000) String resolutionNote) {
}
