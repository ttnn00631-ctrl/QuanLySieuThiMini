package vn.doan.assetmanager.repository;

import org.springframework.data.jpa.repository.JpaRepository;
import vn.doan.assetmanager.model.ProductReview;
import java.util.List;

public interface ProductReviewRepository extends JpaRepository<ProductReview, Long> {
    List<ProductReview> findAllByOrderByCreatedAtDesc();
    List<ProductReview> findByRating(Integer rating);
}
