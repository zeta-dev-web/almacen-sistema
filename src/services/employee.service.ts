import clientAxios from "@/utils/clientAxios.util";

export const employeeClientService = {
  async create(payload: { name: string; username: string; pin: string; role: string }) {
    const { data } = await clientAxios.post("/api/employees", payload);
    return data;
  },

  async update(id: string, payload: Record<string, unknown>) {
    const { data } = await clientAxios.put(`/api/employees/${id}`, payload);
    return data;
  },

  async delete(id: string) {
    const { data } = await clientAxios.delete(`/api/employees/${id}`);
    return data;
  },

  async findAll(params?: { search?: string; page?: number; limit?: number }) {
    const { data } = await clientAxios.get("/api/employees", { params });
    return data;
  },
};
