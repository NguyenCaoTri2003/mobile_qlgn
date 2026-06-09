// src/services/customer.service.ts
import axiosClient from "../api/axiosClient";

export interface SearchCompaniesParams {
  keyword: string;
  page: number;
}

export interface SearchByTaxCodeParams {
  mst: string;
  page: number;
}

export interface SearchByPhoneParams {
  phone: string;
  page: number;
}

export interface SearchByContactNameParams {
  name: string;
  page: number;
}

export interface CompanySearchResult {
  id: number;
  company_name: string;
  tax_code?: string;
  address?: string;
  phone?: string;
  contacts?: ContactInfo[];
}

export interface ContactInfo {
  id: number;
  name: string;
  phone?: string;
}

export interface SearchResponse {
  data: CompanySearchResult[];
  total?: number;
  currentPage?: number;
  totalPages?: number;
}

export const customerService = {
  /**
   * Tìm kiếm công ty theo từ khóa
   */
  async searchCompanies(keyword: string, page: number = 1): Promise<SearchResponse> {
    const res = await axiosClient.post(
      `/customers/search-customers-nhigia`,
      {
        keyword,
        page,
      }
    );
    return res.data;
  },

  /**
   * Tìm kiếm công ty theo mã số thuế
   */
  async searchCompaniesByTaxCode(mst: string, page: number = 1): Promise<SearchResponse> {
    const res = await axiosClient.post(
      `/customers/search-customers-nhigia-by-taxcode`,
      {
        mst,
        page,
      }
    );
    return res.data;
  },

  /**
   * Tìm kiếm công ty theo số điện thoại
   */
  async searchCompaniesByPhone(phone: string, page: number = 1): Promise<SearchResponse> {
    const res = await axiosClient.post(
      `/customers/search-customers-nhigia-by-phone`,
      {
        phone,
        page,
      }
    );
    return res.data;
  },

  /**
   * Tìm kiếm công ty theo tên người liên hệ
   */
  async searchCompaniesByContactName(name: string, page: number = 1): Promise<SearchResponse> {
    const res = await axiosClient.post(
      `/customers/search-customers-nhigia-by-contact-name`,
      {
        name,
        page,
      }
    );
    return res.data;
  },

  /**
   * Lấy chi tiết công ty theo ID
   */
  async getCompanyDetail(id: number): Promise<{ data: CompanySearchResult }> {
    const res = await axiosClient.get(`/customers/${id}`);
    return res.data;
  },

  /**
   * Tạo công ty mới
   */
  async createCompany(data: Partial<CompanySearchResult>): Promise<{ data: CompanySearchResult }> {
    const res = await axiosClient.post(`/customers`, data);
    return res.data;
  },

  /**
   * Cập nhật thông tin công ty
   */
  async updateCompany(id: number, data: Partial<CompanySearchResult>): Promise<{ data: CompanySearchResult }> {
    const res = await axiosClient.put(`/customers/${id}`, data);
    return res.data;
  },
};