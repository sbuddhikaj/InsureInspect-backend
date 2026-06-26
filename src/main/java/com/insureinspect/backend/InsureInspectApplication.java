package com.insureinspect.backend;

import com.insureinspect.backend.model.Job;
import com.insureinspect.backend.model.User;
import com.insureinspect.backend.repository.JobRepository;
import com.insureinspect.backend.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.context.annotation.Bean;

import java.time.LocalDateTime;

@SpringBootApplication
public class InsureInspectApplication {

    public static void main(String[] args) {
        SpringApplication.run(InsureInspectApplication.class, args);
    }

    @Bean
    public CommandLineRunner seedDatabase(JobRepository jobRepository, UserRepository userRepository) {
        return args -> {
            if (userRepository.count() == 0) {
                userRepository.save(new User("admin", "admin123", "System Administrator", "ADMIN"));
                userRepository.save(new User("investigator_1", "password", "John Doe", "INVESTIGATOR"));
                userRepository.save(new User("investigator_2", "password", "Alice Smith", "INVESTIGATOR"));
                System.out.println("--- Seeded database with default users for testing ---");
            }

            if (jobRepository.count() == 0) {
                // Job 1
                Job job1 = new Job();
                job1.setTitle("Residential Roof Fire Damage");
                job1.setClientName("John Doe");
                job1.setAddress("123 Maple Street, Springfield, IL");
                job1.setPhone("+1-555-0199");
                job1.setPolicyNumber("POL-883921");
                job1.setClaimDetails("Kitchen stove fire spread upwards to the roof attic. Damage to rafters and shingles.");
                job1.setScheduledDate("2026-06-27");
                job1.setInvestigatorId("investigator_1");
                job1.setStatus("Pending");
                job1.setUpdatedAt(LocalDateTime.now());
                jobRepository.save(job1);

                // Job 2
                Job job2 = new Job();
                job2.setTitle("Basement Water Pipe Burst");
                job2.setClientName("Alice Smith");
                job2.setAddress("456 Oak Avenue, Metropolis, NY");
                job2.setPhone("+1-555-0144");
                job2.setPolicyNumber("POL-441829");
                job2.setClaimDetails("Main water supply pipe burst in basement, flooding the basement up to 2 feet. Carpets and walls damaged.");
                job2.setScheduledDate("2026-06-28");
                job2.setInvestigatorId("investigator_1");
                job2.setStatus("Pending");
                job2.setUpdatedAt(LocalDateTime.now());
                jobRepository.save(job2);

                // Job 3
                Job job3 = new Job();
                job3.setTitle("Windstorm Structural Assessment");
                job3.setClientName("David Johnson");
                job3.setAddress("789 Pine Road, Lincoln, NE");
                job3.setPhone("+1-555-0122");
                job3.setPolicyNumber("POL-992817");
                job3.setClaimDetails("High wind speed caused a large tree branch to fall on the rear deck and master bedroom wall.");
                job3.setScheduledDate("2026-06-29");
                job3.setInvestigatorId("investigator_2");
                job3.setStatus("Pending");
                job3.setUpdatedAt(LocalDateTime.now());
                jobRepository.save(job3);

                System.out.println("--- Seeded database with initial inspection jobs for testing ---");
            }
        };
    }
}
