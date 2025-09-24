import { api } from './api';

interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'editor' | 'viewer';
  status: 'active' | 'pending' | 'inactive';
  joinedAt: string;
  lastActive: string;
  avatar?: string;
}

interface InviteMemberRequest {
  email: string;
  role: string;
}

interface UpdateMemberRoleRequest {
  role: string;
}

class TeamService {
  async getMembers(): Promise<TeamMember[]> {
    const response = await api.get('/team/members');
    return response.data;
  }

  async inviteMember(email: string, role: string): Promise<void> {
    const request: InviteMemberRequest = { email, role };
    await api.post('/team/invite', request);
  }

  async updateMemberRole(memberId: string, role: string): Promise<void> {
    const request: UpdateMemberRoleRequest = { role };
    await api.put(`/team/members/${memberId}/role`, request);
  }

  async removeMember(memberId: string): Promise<void> {
    await api.delete(`/team/members/${memberId}`);
  }

  async getMemberActivity(memberId: string): Promise<any[]> {
    const response = await api.get(`/team/members/${memberId}/activity`);
    return response.data;
  }

  async getMemberPermissions(memberId: string): Promise<string[]> {
    const response = await api.get(`/team/members/${memberId}/permissions`);
    return response.data;
  }

  async updateMemberPermissions(memberId: string, permissions: string[]): Promise<void> {
    await api.put(`/team/members/${memberId}/permissions`, { permissions });
  }

  async resendInvitation(memberId: string): Promise<void> {
    await api.post(`/team/members/${memberId}/resend-invitation`);
  }

  async cancelInvitation(memberId: string): Promise<void> {
    await api.delete(`/team/invitations/${memberId}`);
  }

  async getTeamStats(): Promise<{
    totalMembers: number;
    activeMembers: number;
    pendingInvitations: number;
    membersByRole: Record<string, number>;
  }> {
    const response = await api.get('/team/stats');
    return response.data;
  }
}

export const teamService = new TeamService();