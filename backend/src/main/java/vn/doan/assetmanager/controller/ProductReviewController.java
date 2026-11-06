package vn.doan.assetmanager.controller;

import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import jakarta.validation.Valid;
import vn.doan.assetmanager.dto.request.ProductReviewRequest;
import vn.doan.assetmanager.model.ProductReview;
import vn.doan.assetmanager.repository.ProductReviewRepository;

import java.time.LocalDateTime;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/reviews")
@PreAuthorize("hasAnyRole('ADMIN', 'STAFF', 'CASHIER')")
public class ProductReviewController {

    private final ProductReviewRepository reviewRepository;

    public ProductReviewController(ProductReviewRepository reviewRepository) {
        this.reviewRepository = reviewRepository;
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    public List<ProductReview> getAll(@RequestParam(required = false) Integer rating) {
        if (rating != null && rating > 0) {
            return reviewRepository.findByRating(rating);
        }
        return reviewRepository.findAllByOrderByCreatedAtDesc();
    }

    @PostMapping
    public ResponseEntity<ProductReview> create(@Valid @RequestBody ProductReviewRequest request) {
        ProductReview review = new ProductReview(
                request.customerName(),
                request.productName(),
                request.rating(),
                request.comment(),
                LocalDateTime.now(),
                null);
        return ResponseEntity.ok(reviewRepository.save(review));
    }

    @PatchMapping("/{id}/reply")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<ProductReview> reply(@PathVariable long id, @RequestBody Map<String, String> body) {
        String replyText = body.get("reply");
        return reviewRepository.findById(id).map(r -> {
            r.setAdminReply(replyText);
            return ResponseEntity.ok(reviewRepository.save(r));
        }).orElse(ResponseEntity.notFound().build());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable long id) {
        if (reviewRepository.existsById(id)) {
            reviewRepository.deleteById(id);
            return ResponseEntity.noContent().build();
        }
        return ResponseEntity.notFound().build();
    }
}
