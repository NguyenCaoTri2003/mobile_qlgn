// import axiosClient from "../api/axiosClient";

// export const departmentService = {
//   async loadDepartments() {
//     try {
//       const res = await axiosClient.get("/departments");
//       return res.data || [];
//     } catch (err) {
//       console.log("Load departments error:", err);
//       return [];
//     }
//   },
// };
// src/services/department.service.ts
import axiosClient from "../api/axiosClient";

export interface Department {
  id: number;
  name: string;
  code: string;
  external_id: number;
  is_default?: number;
}

export interface AttachmentTemplate {
  id: number;
  name: string;
  is_original: boolean;
  is_original_hph: boolean;
  is_copy: boolean;
  detail?: string;
  note?: string;
}

export interface VisaType {
  id: number;
  name: string;
}

export interface VisaDetail {
  id: number;
  name: string;
}

export const departmentService = {
  /**
   * Load tất cả departments
   */
  async loadDepartments() {
    try {
      const res = await axiosClient.get("/departments");
      return res.data || [];
    } catch (err) {
      console.log("Load departments error:", err);
      return [];
    }
  },

  /**
   * Lấy danh sách hồ sơ (attachments) theo department
   */
  async getAttachmentsByDepartment(departmentId: number): Promise<AttachmentTemplate[]> {
    try {
      const res = await axiosClient.get(
        `/departments/${departmentId}/attachments`
      );
      return res.data || [];
    } catch (err) {
      console.log("Get attachments error:", err);
      return [];
    }
  },

  /**
   * Lấy danh sách loại Visa (cấp 1) theo department
   */
  async getVisaVNTypeByDepartment(
    departmentId: number,
    typeId: number
  ): Promise<VisaType[]> {
    try {
      const res = await axiosClient.get(
        `/departments/${departmentId}/visa-vn-type/${typeId}`
      );
      return res.data || [];
    } catch (err) {
      console.log("Get visa type error:", err);
      return [];
    }
  },

  /**
   * Lấy chi tiết Visa (cấp 2) theo department, type và detail
   */
  async getVisaVNTypeDetailsByDepartment(
    departmentId: number,
    typeId: number,
    detailId: number
  ): Promise<VisaDetail[]> {
    try {
      const res = await axiosClient.get(
        `/departments/${departmentId}/visa-vn-type/${typeId}/details/${detailId}`
      );
      return res.data || [];
    } catch (err) {
      console.log("Get visa detail error:", err);
      return [];
    }
  },

  /**
   * Lấy thông tin chi tiết của một department
   */
  async getDepartmentById(id: number): Promise<Department | null> {
    try {
      const res = await axiosClient.get(`/departments/${id}`);
      return res.data || null;
    } catch (err) {
      console.log("Get department error:", err);
      return null;
    }
  },

  /**
   * Lấy department mặc định
   */
  async getDefaultDepartment(): Promise<Department | null> {
    try {
      const departments = await this.loadDepartments();
      return departments.find((d: any) => Number(d.is_default) === 1) || null;
    } catch (err) {
      console.log("Get default department error:", err);
      return null;
    }
  },
};