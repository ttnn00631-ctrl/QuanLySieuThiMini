package vn.doan.assetmanager.controller;

import jakarta.validation.Valid;
import java.util.List;
import org.springframework.http.HttpStatus;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.PutMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.ResponseStatus;
import org.springframework.web.bind.annotation.RestController;
import vn.doan.assetmanager.dto.request.ProductBrandRequest;
import vn.doan.assetmanager.dto.response.ProductBrandResponse;
import vn.doan.assetmanager.service.ProductBrandService;

@RestController
@RequestMapping("/api/product-brands")
@PreAuthorize("hasRole('ADMIN')")
public class ProductBrandController {

    private final ProductBrandService service;

    public ProductBrandController(ProductBrandService service) {
        this.service = service;
    }

    @GetMapping
    public List<ProductBrandResponse> list() {
        return service.list();
    }

    @PostMapping
    @ResponseStatus(HttpStatus.CREATED)
    public ProductBrandResponse create(@Valid @RequestBody ProductBrandRequest request) {
        return service.create(request);
    }

    @PutMapping("/{id}")
    public ProductBrandResponse update(@PathVariable Long id, @Valid @RequestBody ProductBrandRequest request) {
        return service.update(id, request);
    }
}
