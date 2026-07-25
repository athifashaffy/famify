import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase } from '../lib/supabase';
import { Family, FamilyMemberWithProfile } from '../lib/types';
import { useAuth } from './AuthContext';

interface FamilyContextType {
  family: Family | null;
  members: FamilyMemberWithProfile[];
  loading: boolean;
  createFamily: (name: string) => Promise<{ error: Error | null }>;
  joinFamily: (inviteCode: string) => Promise<{ error: Error | null }>;
  refreshFamily: () => Promise<void>;
}

const FamilyContext = createContext<FamilyContextType | undefined>(undefined);

export function FamilyProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const [family, setFamily] = useState<Family | null>(null);
  const [members, setMembers] = useState<FamilyMemberWithProfile[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      // Mark loading before the fetch so route guards wait instead of
      // concluding "no family" and flashing the family-setup screen
      setLoading(true);
      fetchFamily();
    } else {
      setFamily(null);
      setMembers([]);
      setLoading(false);
    }
  }, [user]);

  const fetchFamily = async () => {
    if (!user) return;

    try {
      console.log('🔍 Fetching family for user:', user.id);
      // Use limit(1) to get the first family if user has multiple
      const { data: familyMemberData, error: fmError } = await supabase
        .from('family_members')
        .select('family_id')
        .eq('user_id', user.id)
        .order('joined_at', { ascending: false }) // Get most recent family
        .limit(1)
        .maybeSingle(); // Use maybeSingle instead of single to handle 0 or 1 rows

      console.log('📊 Family member data:', familyMemberData);
      console.log('❌ Family member error:', fmError);

      if (fmError || !familyMemberData) {
        console.log('⚠️ No family membership found - showing family setup');
        setFamily(null);
        setMembers([]);
        setLoading(false);
        return;
      }

      console.log('🔎 Fetching family data for ID:', familyMemberData.family_id);
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('id', familyMemberData.family_id)
        .single();

      console.log('👨‍👩‍👧‍👦 Family data:', familyData);
      console.log('❌ Family error:', familyError);

      if (familyError) {
        console.error('Failed to fetch family:', familyError);
        throw familyError;
      }

      console.log('✅ Setting family state:', familyData);
      setFamily(familyData);

      const { data: membersData, error: membersError } = await supabase
        .from('family_members_with_profiles')
        .select('*')
        .eq('family_id', familyData.id);

      if (membersError) throw membersError;
      setMembers(membersData || []);
    } catch (error) {
      console.error('Error fetching family:', error);
    } finally {
      setLoading(false);
    }
  };

  const createFamily = async (name: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .insert({
          name,
          created_by: user.id,
        })
        .select()
        .single();

      if (familyError) throw familyError;

      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: familyData.id,
        user_id: user.id,
        role: 'parent',
      });

      if (memberError) throw memberError;

      await fetchFamily();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const joinFamily = async (inviteCode: string) => {
    if (!user) return { error: new Error('Not authenticated') };

    try {
      const { data: familyData, error: familyError } = await supabase
        .from('families')
        .select('*')
        .eq('invite_code', inviteCode)
        .single();

      if (familyError) throw familyError;

      const { error: memberError } = await supabase.from('family_members').insert({
        family_id: familyData.id,
        user_id: user.id,
        role: 'parent',
      });

      if (memberError) throw memberError;

      await fetchFamily();
      return { error: null };
    } catch (error) {
      return { error: error as Error };
    }
  };

  const refreshFamily = async () => {
    await fetchFamily();
  };

  return (
    <FamilyContext.Provider
      value={{
        family,
        members,
        loading,
        createFamily,
        joinFamily,
        refreshFamily,
      }}
    >
      {children}
    </FamilyContext.Provider>
  );
}

export function useFamily() {
  const context = useContext(FamilyContext);
  if (context === undefined) {
    throw new Error('useFamily must be used within a FamilyProvider');
  }
  return context;
}
