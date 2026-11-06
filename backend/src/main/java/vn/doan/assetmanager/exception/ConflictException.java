package vn.doan.assetmanager.exception;

import vn.doan.assetmanager.model.*;
import vn.doan.assetmanager.dto.request.*;
import vn.doan.assetmanager.dto.response.*;
import vn.doan.assetmanager.exception.*;

public class ConflictException extends RuntimeException {
    public ConflictException(String message) {
        super(message);
    }
}
