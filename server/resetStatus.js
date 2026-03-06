import supabase from './supabaseClient.js'

async function resetColumn() {
    try {
        const { data, error } = await supabase
            .from('markers1')
            .update({ status: "Empty" }) // Replace null with your reset value

        if (error) {
            console.error('Error resetting column:', error);
        } else {
            console.log('Status Column Reset Successfully:', data);
        }
    } catch (err) {
        console.error('Unexpected error:', err);
    }
}

// Schedule the task
cron.schedule('0 1 * * *', () => { // Every day at midnight
    console.log('resetStatus Running');
    resetColumn();
});

console.log('cronning time');