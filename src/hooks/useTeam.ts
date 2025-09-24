import { useEffect, useState } from 'react';
import { teamService } from '../services/team.service';

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

interface UseTeamReturn {
  members: TeamMember[] | null;
  loading: boolean;
  error: string | null;
  inviteMember: (email: string, role: string) => Promise<void>;
  updateMemberRole: (memberId: string, role: string) => Promise<void>;
  removeMember: (memberId: string) => Promise<void>;
  refreshMembers: () => Promise<void>;
}

export const useTeam = (): UseTeamReturn => {
  const [members, setMembers] = useState<TeamMember[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchMembers = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await teamService.getMembers();
      setMembers(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch team members');
    } finally {
      setLoading(false);
    }
  };

  const inviteMember = async (email: string, role: string) => {
    try {
      setLoading(true);
      await teamService.inviteMember(email, role);
      await fetchMembers(); // Refresh the list
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to invite member');
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const updateMemberRole = async (memberId: string, role: string) => {
    try {
      setLoading(true);
      await teamService.updateMemberRole(memberId, role);
      
      // Update local state optimistically
      setMembers(prev => 
        prev?.map(member => 
          member.id === memberId 
            ? { ...member, role: role as TeamMember['role'] }
            : member
        ) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update member role');
      await fetchMembers(); // Refresh on error
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const removeMember = async (memberId: string) => {
    try {
      setLoading(true);
      await teamService.removeMember(memberId);
      
      // Update local state optimistically
      setMembers(prev => 
        prev?.filter(member => member.id !== memberId) || null
      );
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to remove member');
      await fetchMembers(); // Refresh on error
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const refreshMembers = async () => {
    await fetchMembers();
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  return {
    members,
    loading,
    error,
    inviteMember,
    updateMemberRole,
    removeMember,
    refreshMembers
  };
};