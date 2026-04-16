import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';
import api from '@/lib/api';

interface User {
	id: string;
	username: string;
	name: string;
	role: string;
}

interface AuthContextType {
	user: User | null;
	login: (username: string, password: string) => Promise<boolean>;
	logout: () => void;
	isAuthenticated: boolean;
	isInitializing: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
	const context = useContext(AuthContext);
	if (context === undefined) {
		throw new Error('useAuth must be used within an AuthProvider');
	}
	return context;
};

interface AuthProviderProps {
	children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
	const [user, setUser] = useState<User | null>(null);
	const [isInitializing, setIsInitializing] = useState(true);

	useEffect(() => {
		try {
			const stored = localStorage.getItem('authUser');
			if (stored) {
				const parsed: User = JSON.parse(stored);
				setUser(parsed);
			}
		} catch {}
		setIsInitializing(false);
	}, []);

	// ✅ Real login - calls backend API
	const login = async (username: string, password: string): Promise<boolean> => {
		try {
			const { data } = await api.post('/login', { username, password });

			const userData: User = {
				id: data.user.id,
				username: data.user.username,
				name: data.user.name,
				role: data.user.role
			};

			setUser(userData);
			try {
				localStorage.setItem('authUser', JSON.stringify(userData));
			} catch {}
			return true;
		} catch (error: any) {
			console.error("Login failed:", error.message);
			return false;
		}
	};

	const logout = () => {
		setUser(null);
		try {
			localStorage.removeItem('authUser');
		} catch {}
	};

	const value = {
		user,
		login,
		logout,
		isAuthenticated: !!user,
		isInitializing,
	};

	return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};