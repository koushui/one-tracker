/**
 * NewAPI 原始数据结构
 */
export interface NewAPIRawData {
  success: boolean;
  auto_groups: string[];
  data: Array<{
    model_name: string;
    quota_type: number;
    model_ratio: number;
    model_price: number;
    owner_by: string;
    completion_ratio: number;
    enable_groups: string[];
    supported_endpoint_types: string[];
  }>;
  group_ratio: Record<string, number>;
}
