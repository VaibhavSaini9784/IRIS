import React, { createContext, useContext, useState, ReactNode, useEffect } from 'react';

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

	// Simulated login function - replace with actual API call
	const login = async (username: string, password: string): Promise<boolean> => {
		// Simulate API call delay
		await new Promise(resolve => setTimeout(resolve, 1000));
		
		// Simulated credentials - replace with actual authentication
		if (username === 'admin' && password === 'password') {
			const userData = {
				id: '1',
				username: 'admin',
				name: 'राम कुमार शर्मा',
				role: 'MNREGA Supervisor'
			};
			setUser(userData);
			try {
				localStorage.setItem('authUser', JSON.stringify(userData));
			} catch {}
			return true;
		}
		return false;
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