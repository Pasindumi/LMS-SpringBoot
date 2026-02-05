package com.lms.system;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;

@SpringBootApplication(scanBasePackages = {"com.lms.system", "com.lms.config", "com.lms.controller", "com.lms.service"})
public class LmsSystemApplication {

	public static void main(String[] args) {
		SpringApplication.run(LmsSystemApplication.class, args);
	}

}
