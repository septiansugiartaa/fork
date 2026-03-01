const express = require('express');
const router = express.Router();
const stafController = require('../../controllers/admin/stafController');

router.get('/', stafController.getStaffList);
router.post('/', stafController.createStaff); 
router.put('/:id', stafController.updateStaff);
router.delete('/:id', stafController.deleteStaff);
router.put('/:id/reset-password', stafController.resetPassword);

module.exports = router;