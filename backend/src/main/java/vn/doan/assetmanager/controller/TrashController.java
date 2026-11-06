package vn.doan.assetmanager.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.Authentication;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.doan.assetmanager.dto.request.MoveToTrashRequest;
import vn.doan.assetmanager.dto.response.TrashRecordResponse;
import vn.doan.assetmanager.service.TrashService;

@RestController
@RequestMapping("/api/trash")
@PreAuthorize("hasRole('ADMIN')")
public class TrashController {

    private final TrashService trashService;

    public TrashController(TrashService trashService) {
        this.trashService = trashService;
    }

    @GetMapping
    public List<TrashRecordResponse> list() {
        return trashService.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public TrashRecordResponse moveToTrash(@Valid @RequestBody MoveToTrashRequest request,
            Authentication authentication) {
        return trashService.moveToTrash(request.type(), request.id(), authentication.getName());
    }

    @PatchMapping("/{id}/restore")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void restore(@PathVariable Long id) {
        trashService.restore(id);
    }

    @DeleteMapping("/{id}")
    @ResponseStatus(HttpStatus.NO_CONTENT)
    public void deletePermanently(@PathVariable Long id) {
        trashService.deletePermanently(id);
    }
}
