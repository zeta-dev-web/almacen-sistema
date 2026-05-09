import clientAxios from "@/utils/clientAxios.util";

export const employeeClientService = {
  async findAll(search?: string) {
    const params = search ? { search } : {};
    const { data } = await clientAxios.get("/api/users", { params });
    return data;
  },
};