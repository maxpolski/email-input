import emails from './mock_emails.json';

// Simulating API Request
export const getFilteredEmails = (partialEmail: string) => {
  return new Promise<Array<string>>((res) =>
    // Should be implemented on a Back End
    res(emails.filter((e) => e.includes(partialEmail.toLowerCase())))
  );
};
