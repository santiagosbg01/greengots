#!/usr/bin/env tsx

import { getPool, withTransaction } from './db/connection';
import { UserRepository } from './db/repositories/user';
import { TeamRepository } from './db/repositories/team';
import { BudgetRepository } from './db/repositories/budget';
import { FxRepository } from './db/repositories/fx';

async function testDatabase() {
  console.log('🧪 Testing database setup...');

  try {
    await withTransaction(async (client) => {
      const userRepo = new UserRepository(client);
      const teamRepo = new TeamRepository(client);
      const budgetRepo = new BudgetRepository(client);
      const fxRepo = new FxRepository(client);

      // Test user operations
      console.log('👤 Testing user operations...');
      const testUser = await userRepo.create({
        email: 'test@example.com',
        display_name: 'Test User',
        status: 'active'
      });
      console.log('✅ User created:', testUser.id);

      // Test team operations
      console.log('🏢 Testing team operations...');
      const testTeam = await teamRepo.create({
        name: 'Test Team',
        owner_user_id: testUser.id
      });
      console.log('✅ Team created:', testTeam.id);

      // Test cost center
      console.log('💰 Testing cost center operations...');
      const costCenter = await teamRepo.createCostCenter({
        team_id: testTeam.id,
        code: 'TEST001',
        name: 'Test Cost Center',
        active: true
      });
      console.log('✅ Cost center created:', costCenter.id);

      // Test FX rate
      console.log('💱 Testing FX operations...');
      const fxRate = await fxRepo.create({
        as_of_date: new Date(),
        from_ccy: 'USD',
        to_ccy: 'MXN',
        rate: 20.0,
        source_note: 'Test rate',
        created_by: testUser.id
      });
      console.log('✅ FX rate created:', fxRate.id);

      // Test budget
      console.log('📊 Testing budget operations...');
      const budget = await budgetRepo.create({
        team_id: testTeam.id,
        title: 'Test Budget 2025',
        description: 'Test budget for 2025',
        fiscal_year: 2025,
        base_currency: 'USD',
        status: 'draft',
        created_by: testUser.id,
        updated_by: testUser.id
      });
      console.log('✅ Budget created:', budget.id);

      // Test budget section
      console.log('📋 Testing budget section operations...');
      const section = await budgetRepo.createSection({
        budget_id: budget.id,
        title: 'Test Section',
        description: 'Test section',
        sort_order: 1
      });
      console.log('✅ Budget section created:', section.id);

      // Test budget item
      console.log('📝 Testing budget item operations...');
      const item = await budgetRepo.createItem({
        budget_id: budget.id,
        section_id: section.id,
        cost_center_id: costCenter.id,
        owner_user_id: testUser.id,
        type: 'software_tool',
        nature: 'recurring',
        vendor_or_person: 'Test Vendor',
        description: 'Test software subscription',
        local_currency: 'USD',
        local_amount: 100.00,
        fx_rate_id_snapshot: fxRate.id,
        usd_amount: 100.00,
        allocations_json: [8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.33, 8.37],
        status: 'planned',
        start_month: new Date('2025-01-01'),
        end_month: new Date('2025-12-31'),
        created_by: testUser.id,
        updated_by: testUser.id
      });
      console.log('✅ Budget item created:', item.id);

      console.log('🎉 All database operations completed successfully!');
    });

  } catch (error) {
    console.error('❌ Database test failed:', error);
    throw error;
  }
}

if (require.main === module) {
  testDatabase()
    .then(() => {
      console.log('✅ Database test completed successfully!');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Database test failed:', error);
      process.exit(1);
    });
}
