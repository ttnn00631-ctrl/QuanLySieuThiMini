package vn.doan.assetmanager.dto.response;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;

import java.time.Instant;

public record AssignmentResponse(Long id, String assigneeName, String location, Instant assignedAt,
    Instant returnedAt, String note, String returnNote) {

    public static AssignmentResponse from(AssignmentRecord assignment) {
        return new AssignmentResponse(assignment.getId(), assignment.getAssigneeName(), assignment.getLocation(),
            assignment.getAssignedAt(), assignment.getReturnedAt(), assignment.getNote(), assignment.getReturnNote());
    }
}
